
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Person } from '../types';

const MemberForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { people, addPerson, updatePerson, getPerson } = useData();
  const [person, setPerson] = useState<Omit<Person, 'id'>>({
    fullName: '',
    nickname: '',
    gender: 'Male',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    photo: '',
    occupation: '',
    education: '',
    parentId1: null,
    parentId2: null,
    spouseIds: [],
    birthOrder: undefined,
  });
  
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      getPerson(parseInt(id, 10)).then(p => {
        if (p) {
          // Destructure to avoid passing the id into the state object
          const { id: personId, ...personData } = p;
          setPerson(personData);
        }
      });
    }
  }, [id, isEditing, getPerson]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'parentId1' || name === 'parentId2') {
      setPerson(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
    } else if (name === 'birthOrder') {
      setPerson(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined }));
    } else {
      setPerson(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const value: number[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
            value.push(parseInt(options[i].value, 10));
        }
    }
    setPerson(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPerson(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedPerson = {
      ...person,
      parentId1: person.parentId1 ? Number(person.parentId1) : null,
      parentId2: person.parentId2 ? Number(person.parentId2) : null,
    };
    
    console.log('Saving person:', cleanedPerson);
    
    if (isEditing && id) {
        await updatePerson({ id: parseInt(id, 10), ...cleanedPerson });
        
        // Auto-update spouse relationships (two-way)
        const currentId = parseInt(id, 10);
        const oldPerson = await getPerson(currentId);
        const oldSpouseIds = oldPerson?.spouseIds || [];
        const newSpouseIds = cleanedPerson.spouseIds || [];
        
        // Add this person to new spouses
        for (const spouseId of newSpouseIds) {
          if (!oldSpouseIds.includes(spouseId)) {
            const spouse = await getPerson(spouseId);
            if (spouse && !spouse.spouseIds?.includes(currentId)) {
              await updatePerson({
                ...spouse,
                spouseIds: [...(spouse.spouseIds || []), currentId]
              });
            }
          }
        }
        
        // Remove this person from removed spouses
        for (const spouseId of oldSpouseIds) {
          if (!newSpouseIds.includes(spouseId)) {
            const spouse = await getPerson(spouseId);
            if (spouse) {
              await updatePerson({
                ...spouse,
                spouseIds: (spouse.spouseIds || []).filter(id => id !== currentId)
              });
            }
          }
        }
    } else {
        const newId = await addPerson(cleanedPerson);
        
        // Auto-update spouse relationships for new person
        for (const spouseId of cleanedPerson.spouseIds || []) {
          const spouse = await getPerson(spouseId);
          if (spouse && !spouse.spouseIds?.includes(newId)) {
            await updatePerson({
              ...spouse,
              spouseIds: [...(spouse.spouseIds || []), newId]
            });
          }
        }
    }
    navigate('/admin');
  };
  
  const availableParents = people.filter(p => p.id !== parseInt(id || '0', 10));
  const availableSpouses = people.filter(p => p.id !== parseInt(id || '0', 10));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField name="fullName" label="Full Name" value={person.fullName} onChange={handleChange} required />
            <InputField name="nickname" label="Nickname" value={person.nickname} onChange={handleChange} />
            <SelectField name="gender" label="Gender" value={person.gender} onChange={handleChange} options={['Male', 'Female']} />
            <InputField name="birthDate" label="Birth Date" type="date" value={person.birthDate} onChange={handleChange} />
            <InputField name="birthPlace" label="Birth Place" value={person.birthPlace} onChange={handleChange} />
            <InputField name="deathDate" label="Death Date (optional)" type="date" value={person.deathDate} onChange={handleChange} />
            <InputField name="occupation" label="Occupation" value={person.occupation} onChange={handleChange} />
            <InputField name="education" label="Education" value={person.education} onChange={handleChange} />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {person.photo ? <img src={person.photo} alt="Profile" className="w-full h-full object-cover" /> : <i className="fas fa-user text-4xl text-gray-400"></i>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField name="parentId1" label="Parent 1" value={String(person.parentId1 || '')} onChange={handleChange} options={availableParents.map(p => ({value: p.id, label: p.fullName}))} placeholder="Select a parent" />
            <SelectField name="parentId2" label="Parent 2" value={String(person.parentId2 || '')} onChange={handleChange} options={availableParents.map(p => ({value: p.id, label: p.fullName}))} placeholder="Select a parent" />
          </div>
          
          <div>
            <label htmlFor="birthOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <i className="fas fa-sort-numeric-down mr-2"></i>
              Urutan Anak (opsional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Kosongkan untuk urutan otomatis berdasarkan tanggal lahir. Isi angka (1, 2, 3, dst) untuk urutan manual.</p>
            <input
              type="number"
              id="birthOrder"
              name="birthOrder"
              min="1"
              value={person.birthOrder || ''}
              onChange={handleChange}
              placeholder="Contoh: 1 untuk anak pertama, 2 untuk anak kedua"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
              <label htmlFor="spouseIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-heart text-red-500 mr-2"></i>
                Menikah dengan (Spouse)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tekan Ctrl (Windows) atau Cmd (Mac) untuk memilih lebih dari satu</p>
              <select
                id="spouseIds"
                name="spouseIds"
                multiple
                value={person.spouseIds?.map(String) || []}
                onChange={handleMultiSelectChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 h-32"
              >
                {availableSpouses.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
              {person.spouseIds && person.spouseIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {person.spouseIds.map(spouseId => {
                    const spouse = people.find(p => p.id === spouseId);
                    return spouse ? (
                      <span key={spouseId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <i className="fas fa-heart mr-1"></i>
                        {spouse.fullName}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={() => navigate('/admin')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{isEditing ? 'Save Changes' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper components for form fields
const InputField: React.FC<{name: string, label: string, value?: string, onChange: (e: any) => void, type?: string, required?: boolean}> = ({ name, label, value, onChange, type = 'text', required = false}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input type={type} name={name} id={name} value={value || ''} onChange={onChange} required={required} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"/>
  </div>
);

const SelectField: React.FC<{name: string, label: string, value: string, onChange: (e: any) => void, options: (string | {value: any, label: string})[], placeholder?: string}> = ({ name, label, value, onChange, options, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, i) => 
        typeof opt === 'string' ? <option key={i} value={opt}>{opt}</option> : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  </div>
);

export default MemberForm;
